import type { AIAction } from "../../types/ai";

export type AIProviderGenerateParams = {
  action: AIAction;
  title: string;
  content: string;
  existingTags: string[];
  existingCategories: string[];
  model: string;
};

export interface AIProvider {
  generate(params: AIProviderGenerateParams): Promise<unknown>;
}
