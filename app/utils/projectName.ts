import { description, chatId } from '~/lib/persistence';

export function getProjectName() {
  const projectTitle = (description.get() ?? 'project')
    .toLocaleLowerCase()
    .split(' ')
    .join('_')
    .replace(/[^a-z0-9_]/g, '');

  const id = chatId.get()?.substring(0, 8) || 'unknown';

  return `${projectTitle}_${id}`;
}
