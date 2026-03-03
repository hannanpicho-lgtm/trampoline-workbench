import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export const getBase44Client = (req: Request) => createClientFromRequest(req);
