export interface CloudflareConnection {
  user: any;
  token: string;
  accountId: string;
  stats?: {
    projects: CloudflareProject[];
    totalProjects: number;
  };
}

export interface CloudflareProject {
  id: string;
  name: string;
  url: string;
  chatId: string;
  created_on: string;
  modified_on: string;
  latest_deployment?: {
    id: string;
    url: string;
    environment: string;
    created_on: string;
  };
}
