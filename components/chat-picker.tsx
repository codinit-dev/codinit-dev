import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { TemplateId, Templates } from '@/lib/templates'
import 'core-js/actual/object/group-by'
import { Sparkles } from 'lucide-react'
import Image from 'next/image'

export function ChatPicker({
  templates,
  selectedTemplate,
  onSelectedTemplateChange,
  models,
  languageModel,
  onLanguageModelChange,
}: {
  templates: Templates
  selectedTemplate: 'auto' | TemplateId
  onSelectedTemplateChange: (template: 'auto' | TemplateId) => void
  models: LLMModel[]
  languageModel: LLMModelConfig
  onLanguageModelChange: (config: LLMModelConfig) => void
}) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex flex-col">
        <Select
          name="template"
          defaultValue={selectedTemplate}
          onValueChange={onSelectedTemplateChange}
        >
          <SelectTrigger className="whitespace-nowrap border-none shadow-none focus:ring-0 px-0 py-0 h-6 text-xs bg-transparent">
            <SelectValue placeholder="Select a persona" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectGroup>
              <SelectLabel>Persona</SelectLabel>
              <SelectItem value="auto">
                <div className="flex items-center space-x-2">
                  <Sparkles
                    className="flex text-[#a1a1aa]"
                    width={14}
                    height={14}
                  />
                  <span>Auto</span>
                </div>
              </SelectItem>
              {Object.entries(templates).map(([templateId, template]) => (
                <SelectItem key={templateId} value={templateId}>
                  <div className="flex items-center space-x-2">
                    <Image
                      className="flex"
                      src={`/thirdparty/templates/${templateId}.svg`}
                      alt={templateId}
                      width={14}
                      height={14}
                    />
                    <span>{template.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col">
        <Select
          name="languageModel"
          value={languageModel.model}
          onValueChange={(e) => onLanguageModelChange({ model: e })}
        >
          <SelectTrigger className="whitespace-nowrap border-none shadow-none focus:ring-0 px-0 py-0 h-6 text-xs bg-transparent">
            <SelectValue placeholder="Language model" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(
              Object.groupBy(models, (model) =>
                model.providerId === 'openrouter'
                  ? 'openrouter'
                  : model.provider,
              ),
            ).map(([groupKey, models]) => (
              <SelectGroup key={groupKey}>
                <SelectLabel>
                  {groupKey === 'openrouter' ? 'OpenRouter' : groupKey}
                </SelectLabel>
                {models?.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center space-x-2">
                      <Image
                        className="flex"
                        src={`/thirdparty/logos/${model.providerId}.svg`}
                        alt={model.provider}
                        width={14}
                        height={14}
                      />
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
