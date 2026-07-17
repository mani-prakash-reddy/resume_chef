"""
Chat / Resume Agent — LangGraph streaming agent with tool calling.

Tools (runtime-injected per request):
  - read_resume(starting_line, no_of_lines)
  - patch_resume(patches: list[dict])

Streams SSE events to the caller:
  - {"type": "token",  "content": "..."}       — LLM text token
  - {"type": "status", "content": "..."}       — tool call status indicator
  - {"type": "patch_result", "content": {...}} — result of patch_resume call
  - {"type": "done"}                           — stream complete
  - {"type": "error",  "content": "..."}       — unrecoverable error
"""

import json
from typing import AsyncGenerator, Any

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.tools import StructuredTool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from typing_extensions import Annotated, TypedDict

from config import settings


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an expert resume editor and career coach.

Your primary job is to help the user improve their resume. You have access to two tools:
  - read_resume: reads the current resume with line numbers
  - patch_resume: applies targeted line-range edits to the resume

Guidelines:
1. ALWAYS call read_resume before making any edits so you know the current state of the file.
2. If the file is large, you may read it in sections using starting_line + no_of_lines, but prefer reading the full file in one call when possible.
3. Send ALL intended edits in a single patch_resume call. Do not send overlapping patch ranges — each line number must appear in at most one patch.
4. Line numbers in patch_resume ALWAYS refer to the file as it was when you last called read_resume, NOT to any intermediate patched state.
5. After patching, confirm what was changed in a clear, concise message to the user.
6. If the user only asks a question (no edits needed), you may skip the read if the context is already clear.
7. Keep your explanations concise — the user is busy job hunting.

Note: Tool-based editing only works for LaTeX and HTML resumes. For WYSIWYG resumes, you can still answer questions and give suggestions, but cannot directly edit the file.
"""

# ---------------------------------------------------------------------------
# Agent state
# ---------------------------------------------------------------------------


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    resume_id: str
    builder_type: str


# ---------------------------------------------------------------------------
# Build the LangGraph agent
# ---------------------------------------------------------------------------


def build_chat_agent(tools_dict: dict):
    """
    Build and return a compiled LangGraph graph for the chat agent.
    tools_dict: {"read_resume": <async fn>, "patch_resume": <async fn>}
    """

    # Wrap async functions as LangChain StructuredTools
    langchain_tools = []

    read_fn = tools_dict["read_resume"]
    patch_fn = tools_dict["patch_resume"]

    read_tool = StructuredTool.from_function(
        coroutine=read_fn,
        name="read_resume",
        description=(
            "Read the current resume content with 1-indexed line numbers. "
            "Parameters starting_line and no_of_lines are both optional. "
            "Returns the full resume if no parameters are given."
        ),
    )

    patch_tool = StructuredTool.from_function(
        coroutine=patch_fn,
        name="patch_resume",
        description=(
            "Apply ordered line-range replacements to the resume. "
            "Each patch: {from: int, to: int, content: str}. "
            "Line numbers always reference the ORIGINAL file (not post-patch positions). "
            "Send all edits in a single call. Do not overlap ranges."
        ),
    )

    langchain_tools = [read_tool, patch_tool]

    llm = ChatOpenAI(
        model=settings.default_chat_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        streaming=True,
    ).bind_tools(langchain_tools)

    tool_map = {t.name: t for t in langchain_tools}

    # -----------------------------------------------------------------------
    # Graph nodes
    # -----------------------------------------------------------------------

    async def call_llm(state: AgentState) -> dict:
        response = await llm.ainvoke(state["messages"])
        return {"messages": [response]}

    async def call_tools(state: AgentState) -> dict:
        last_msg: AIMessage = state["messages"][-1]
        tool_messages = []
        for tool_call in last_msg.tool_calls:
            tool = tool_map.get(tool_call["name"])
            if tool is None:
                result = f"Unknown tool: {tool_call['name']}"
            else:
                result = await tool.ainvoke(tool_call["args"])
            tool_messages.append(
                ToolMessage(
                    content=json.dumps(result) if not isinstance(result, str) else result,
                    tool_call_id=tool_call["id"],
                    name=tool_call["name"],
                )
            )
        return {"messages": tool_messages}

    def should_continue(state: AgentState) -> str:
        last_msg = state["messages"][-1]
        if isinstance(last_msg, AIMessage) and last_msg.tool_calls:
            return "tools"
        return END

    # -----------------------------------------------------------------------
    # Build graph
    # -----------------------------------------------------------------------

    graph = StateGraph(AgentState)
    graph.add_node("llm", call_llm)
    graph.add_node("tools", call_tools)
    graph.set_entry_point("llm")
    graph.add_conditional_edges("llm", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "llm")

    return graph.compile()


# ---------------------------------------------------------------------------
# Streaming runner
# ---------------------------------------------------------------------------


async def run_chat_agent_streaming(
    messages: list[dict],
    resume_id: str,
    builder_type: str,
    tools_dict: dict,
    ats_context: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    Run the chat agent and yield SSE-formatted JSON strings.

    Yields lines like:
      data: {"type": "token", "content": "Hello"}
      data: {"type": "status", "content": "Reading resume..."}
      data: {"type": "done"}
    """

    def sse(event: dict) -> str:
        return f"data: {json.dumps(event)}\n\n"

    try:
        compiled = build_chat_agent(tools_dict)

        # Build message history
        lc_messages: list[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT)]

        # Inject ATS context as a hidden system message when "Improve Resume" is clicked
        if ats_context:
            lc_messages.append(SystemMessage(content=ats_context))

        for msg in messages:
            if msg["role"] == "user":
                lc_messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                lc_messages.append(AIMessage(content=msg["content"]))

        # If builder type is wysiwyg, append a note
        if builder_type == "wysiwyg":
            lc_messages.append(
                SystemMessage(
                    content=(
                        "Note: This user has a WYSIWYG resume. "
                        "You can give suggestions but CANNOT use read_resume or patch_resume tools."
                    )
                )
            )

        initial_state: AgentState = {
            "messages": lc_messages,
            "resume_id": resume_id,
            "builder_type": builder_type,
        }

        # Stream events from LangGraph
        async for event in compiled.astream_events(initial_state, version="v2"):
            kind = event.get("event")
            name = event.get("name", "")
            data = event.get("data", {})

            # LLM token streaming
            if kind == "on_chat_model_stream":
                chunk = data.get("chunk")
                if chunk and chunk.content:
                    yield sse({"type": "token", "content": chunk.content})

            # Tool call start → show status indicator
            elif kind == "on_tool_start":
                if name == "read_resume":
                    yield sse({"type": "status", "content": "Reading resume..."})
                elif name == "patch_resume":
                    yield sse({"type": "status", "content": "Patching resume..."})

            # Tool call end → surface patch result for diff preview
            elif kind == "on_tool_end" and name == "patch_resume":
                output = data.get("output", "")
                try:
                    patch_result = json.loads(output) if isinstance(output, str) else output
                    yield sse({"type": "patch_result", "content": patch_result})
                except Exception:
                    pass

        yield sse({"type": "done"})

    except Exception as exc:
        yield sse({"type": "error", "content": str(exc)})
