import { base44 } from './base44Client';

// Only file-upload integrations are exposed to client code — they do not
// consume integration credits. All restricted integrations (InvokeLLM,
// GenerateImage, GenerateSpeech, SendEmail, etc.) are called exclusively
// from backend functions via base44.asServiceRole.integrations.Core to
// protect integration credits from client-side abuse.
export const UploadPublicFile = base44.integrations.Core.UploadPublicFile;
export const UploadPrivateFile = base44.integrations.Core.UploadPrivateFile;