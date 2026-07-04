import { Plus, Trash2, GripVertical } from "lucide-react";
import { useResume } from "../../hooks/useResume";
import Input, { Textarea } from "../ui/Input";
import Button from "../ui/Button";
import Card from "../ui/Card";

export default function ElementsCanvas() {
  const {
    elements,
    updateContact,
    updateSummary,
    updateExperience,
    updateExperienceBullet,
    addExperienceBullet,
    updateSkill,
    addSkill,
    removeSkill,
  } = useResume();

  return (
    <div className="space-y-4 max-w-2xl">
      <Section title="Contact">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Full Name"
            value={elements.contact.name}
            onChange={(e) => updateContact("name", e.target.value)}
          />
          <Input
            label="Email"
            value={elements.contact.email}
            onChange={(e) => updateContact("email", e.target.value)}
          />
          <Input
            label="Phone"
            value={elements.contact.phone}
            onChange={(e) => updateContact("phone", e.target.value)}
          />
          <Input
            label="LinkedIn"
            value={elements.contact.linkedin}
            onChange={(e) => updateContact("linkedin", e.target.value)}
          />
          <Input
            label="Location"
            className="col-span-2"
            value={elements.contact.location}
            onChange={(e) => updateContact("location", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Summary">
        <Textarea
          value={elements.summary}
          onChange={(e) => updateSummary(e.target.value)}
          rows={4}
        />
      </Section>

      <Section title="Experience">
        {elements.experience.map((exp) => (
          <Card key={exp.id} className="space-y-3">
            <div className="flex items-start gap-2">
              <GripVertical className="w-4 h-4 mt-2 text-outline shrink-0" />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Input
                  label="Title"
                  value={exp.title}
                  onChange={(e) =>
                    updateExperience(exp.id, "title", e.target.value)
                  }
                />
                <Input
                  label="Company"
                  value={exp.company}
                  onChange={(e) =>
                    updateExperience(exp.id, "company", e.target.value)
                  }
                />
                <Input
                  label="Start"
                  value={exp.start}
                  onChange={(e) =>
                    updateExperience(exp.id, "start", e.target.value)
                  }
                />
                <Input
                  label="End"
                  value={exp.end}
                  onChange={(e) =>
                    updateExperience(exp.id, "end", e.target.value)
                  }
                />
                <Input
                  label="Location"
                  className="col-span-2"
                  value={exp.location}
                  onChange={(e) =>
                    updateExperience(exp.id, "location", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-2 pl-6">
              <span className="text-xs font-semibold text-on-surface-variant">
                Bullets
              </span>
              {exp.bullets.map((bullet, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary-bright focus:outline-none"
                    value={bullet}
                    onChange={(e) =>
                      updateExperienceBullet(exp.id, i, e.target.value)
                    }
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addExperienceBullet(exp.id)}
              >
                <Plus className="w-3.5 h-3.5" />
                Add bullet
              </Button>
            </div>
          </Card>
        ))}
      </Section>

      <Section title="Education">
        {elements.education.map((edu) => (
          <Card key={edu.id}>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Degree" value={edu.degree} readOnly />
              <Input label="School" value={edu.school} readOnly />
            </div>
          </Card>
        ))}
      </Section>

      <Section title="Skills">
        <div className="flex flex-wrap gap-2">
          {elements.skills.map((skill, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                className="px-3 py-1.5 text-sm bg-secondary-container text-primary rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-primary-bright w-28"
                value={skill}
                onChange={(e) => updateSkill(i, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeSkill(i)}
                className="p-1 text-outline hover:text-error cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addSkill}>
            <Plus className="w-3.5 h-3.5" />
            Add skill
          </Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-on-surface mb-3 uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}
