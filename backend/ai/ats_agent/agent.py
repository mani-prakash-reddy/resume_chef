"""
ATS Agent — LangGraph structured-output agent.

One-shot evaluation: no tool calls, no streaming.
Receives (resume_content, job_description) and returns a structured JSON report.

Output schema:
  {
    "score": 0-100,
    "matched_keywords": [...],
    "missing_keywords": [...],
    "suggestions": [...],
    "summary": "..."
  }
"""

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from config import settings


# ---------------------------------------------------------------------------
# Output schema (LangGraph structured output mode)
# ---------------------------------------------------------------------------


class AtsAnalysisResult(BaseModel):
    score: int = Field(description="ATS compatibility score from 0 to 100")
    matched_keywords: list[str] = Field(
        description="Keywords from the job description that appear in the resume"
    )
    missing_keywords: list[str] = Field(
        description="Important keywords from the job description missing from the resume"
    )
    suggestions: list[str] = Field(
        description="3-5 specific, actionable suggestions to improve the resume for this job"
    )
    summary: str = Field(
        description="A 2-3 sentence summary of how well the resume matches the job description"
    )


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

ATS_SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) analyst and career coach.

Your task is to analyze a candidate's resume against a specific job description and produce a structured evaluation.

Guidelines:
1. Score (0-100): Rate how well the resume matches the JD based on:
   - Keyword overlap (skills, technologies, domain terms)
   - Role alignment (title, seniority level, responsibilities)
   - Experience relevance
   
2. Keywords: Extract meaningful technical skills, tools, methodologies, and domain terms.
   - matched_keywords: terms that appear (or clearly equivalent terms) in both resume and JD
   - missing_keywords: important terms from the JD absent from the resume
   
3. Suggestions: Be specific and actionable. Reference actual sections/bullets from the resume.
   Good: "Reframe bullet 3 in Experience to mention Kubernetes cluster management."
   Bad: "Add more technical skills."
   
4. Summary: Be honest but constructive. Mention the strongest overlap AND the most critical gap.
"""


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------


async def run_ats_agent(resume_content: str, job_description: str) -> AtsAnalysisResult:
    """
    Run the ATS agent and return a structured AtsAnalysisResult.
    No streaming — caller shows a spinner while this completes.
    """
    llm = ChatOpenAI(
        model=settings.default_ats_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        streaming=False,
    )

    structured_llm = llm.with_structured_output(AtsAnalysisResult)

    messages = [
        SystemMessage(content=ATS_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"## Resume\n\n{resume_content}\n\n"
                f"## Job Description\n\n{job_description}\n\n"
                "Please analyze this resume against the job description."
            )
        ),
    ]

    result: AtsAnalysisResult = await structured_llm.ainvoke(messages)
    return result
