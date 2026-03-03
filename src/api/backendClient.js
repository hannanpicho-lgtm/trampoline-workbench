import { base44 } from '@/api/base44Client';

/**
 * @typedef {Object} EntityApi
 * @property {(sort?: string, limit?: number) => Promise<any[]>} list
 * @property {(criteria?: Record<string, any>, sort?: string, limit?: number) => Promise<any[]>} filter
 * @property {(id: string) => Promise<any>} get
 * @property {(callback: (event: any) => void) => (() => void)} subscribe
 * @property {(payload: Record<string, any>) => Promise<any>} create
 * @property {(payload: Record<string, any>[]) => Promise<any>} bulkCreate
 * @property {(id: string, payload: Record<string, any>) => Promise<any>} update
 * @property {(id: string) => Promise<any>} delete
 */

const importMeta = /** @type {any} */ (import.meta);
const auth = /** @type {any} */ (base44.auth);

const resolvedProvider = importMeta?.env?.VITE_BACKEND_PROVIDER || 'base44';
const apiBaseUrl = (importMeta?.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const buildUrl = (path, query = {}) => {
	if (!apiBaseUrl) {
		throw new Error('VITE_API_BASE_URL is required when VITE_BACKEND_PROVIDER=rest');
	}

	const url = new URL(`${apiBaseUrl}${path}`);
	Object.entries(query).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			url.searchParams.set(key, String(value));
		}
	});
	return url.toString();
};

/**
 * @typedef {{
 *  method?: string;
 *  body?: Record<string, any>;
 *  query?: Record<string, any>;
 * }} RestRequestOptions
 */

/** @param {string} path @param {RestRequestOptions} [options] */
const restRequest = async (path, options = {}) => {
	const { method = 'GET', body, query } = options;
	const response = await fetch(buildUrl(path, query), {
		method,
		headers: {
			'Content-Type': 'application/json'
		},
		body: body ? JSON.stringify(body) : undefined
	});

	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(payload?.error || `Request failed: ${response.status}`);
	}

	return payload;
};

const trainingAccountsApi = {
	async create(payload) {
		if (resolvedProvider === 'rest') {
			return restRequest('/api/training-accounts', {
				method: 'POST',
				body: payload
			});
		}

		return base44.functions.invoke('createTrainingAccount', payload);
	},

	async listByReferrer(referrerId) {
		if (resolvedProvider === 'rest') {
			const data = await restRequest('/api/training-accounts', {
				query: { referredBy: referrerId, isTrainingAccount: true }
			});
			return data?.items || data || [];
		}

		return base44.entities.AppUser.filter({
			referredBy: referrerId,
			isTrainingAccount: true
		});
	},

	async listAll() {
		if (resolvedProvider === 'rest') {
			const data = await restRequest('/api/training-accounts', {
				query: { isTrainingAccount: true }
			});
			return data?.items || data || [];
		}

		return base44.entities.AppUser.filter({
			isTrainingAccount: true
		});
	},

	async delete(accountId) {
		if (resolvedProvider === 'rest') {
			return restRequest(`/api/training-accounts/${accountId}`, { method: 'DELETE' });
		}

		return base44.entities.AppUser.delete(accountId);
	}
};

const trainingLogsApi = {
	async listByReferrer(referrerId) {
		if (resolvedProvider === 'rest') {
			const data = await restRequest('/api/training-account-logs', {
				query: { referrerId }
			});
			return data?.items || data || [];
		}

		return base44.entities.TrainingAccountLog.filter({ referrerId });
	},

	async listAll() {
		if (resolvedProvider === 'rest') {
			const data = await restRequest('/api/training-account-logs');
			return data?.items || data || [];
		}

		return base44.entities.TrainingAccountLog.filter({});
	},

	async updateStatus(logId, status) {
		if (resolvedProvider === 'rest') {
			return restRequest(`/api/training-account-logs/${logId}`, {
				method: 'PATCH',
				body: { status }
			});
		}

		return base44.entities.TrainingAccountLog.update(logId, { status });
	},

	async delete(logId) {
		if (resolvedProvider === 'rest') {
			return restRequest(`/api/training-account-logs/${logId}`, { method: 'DELETE' });
		}

		return base44.entities.TrainingAccountLog.delete(logId);
	}
};

const transactionsApi = {
	async listTrainingProfitShareByUser(userId) {
		if (resolvedProvider === 'rest') {
			const data = await restRequest('/api/transactions', {
				query: { userId, type: 'training_profit_share' }
			});
			return data?.items || data || [];
		}

		return base44.entities.Transaction.filter({
			userId,
			type: 'training_profit_share'
		});
	}
};

const authApi = {
	async me() {
		if (resolvedProvider === 'rest') {
			return restRequest('/api/auth/me');
		}

		return auth.me();
	},

	async updateMe(payload) {
		if (resolvedProvider === 'rest') {
			return restRequest('/api/auth/me', {
				method: 'PATCH',
				body: payload
			});
		}

		return auth.updateMe(payload);
	},

	async signInWithPassword(payload) {
		if (resolvedProvider === 'rest') {
			return restRequest('/api/auth/sign-in', {
				method: 'POST',
				body: payload
			});
		}

		return auth.signInWithPassword(payload);
	},

	logout(redirectPath) {
		if (resolvedProvider === 'rest') {
			const target = redirectPath || '/';
			if (typeof window !== 'undefined') {
				window.location.href = target;
			}
			return;
		}

		return redirectPath ? auth.logout(redirectPath) : auth.logout();
	},

	redirectToLogin(returnPath) {
		if (resolvedProvider === 'rest') {
			const target = returnPath ? `/login?next=${encodeURIComponent(returnPath)}` : '/login';
			if (typeof window !== 'undefined') {
				window.location.href = target;
			}
			return;
		}

		return returnPath ? auth.redirectToLogin(returnPath) : auth.redirectToLogin();
	}
};

const functionsApi = {
	async invoke(functionName, payload = {}) {
		if (resolvedProvider === 'rest') {
			return restRequest(`/api/functions/${functionName}`, {
				method: 'POST',
				body: payload
			});
		}

		return base44.functions.invoke(functionName, payload);
	}
};

const integrationsApi = {
	Core: {
		async UploadFile({ file }) {
			if (resolvedProvider === 'rest') {
				const formData = new FormData();
				formData.append('file', file);

				const response = await fetch(buildUrl('/api/integrations/upload-file'), {
					method: 'POST',
					body: formData
				});

				const payload = await response.json().catch(() => ({}));
				if (!response.ok) {
					throw new Error(payload?.error || `Request failed: ${response.status}`);
				}

				return payload;
			}

			return base44.integrations.Core.UploadFile({ file });
		},

		async InvokeLLM(payload) {
			if (resolvedProvider === 'rest') {
				return restRequest('/api/integrations/invoke-llm', {
					method: 'POST',
					body: payload
				});
			}

			return base44.integrations.Core.InvokeLLM(payload);
		}
	}
};

const createEntityApi = (entityName) => ({
	async list(sort, limit) {
		if (resolvedProvider === 'rest') {
			const data = await restRequest(`/api/entities/${entityName}`, {
				query: {
					_sort: sort,
					_limit: limit
				}
			});
			return data?.items || data || [];
		}

		return base44.entities[entityName].list(sort, limit);
	},

	async filter(criteria = {}, sort, limit) {
		if (resolvedProvider === 'rest') {
			const data = await restRequest(`/api/entities/${entityName}`, {
				query: {
					...criteria,
					_sort: sort,
					_limit: limit
				}
			});
			return data?.items || data || [];
		}

		return base44.entities[entityName].filter(criteria, sort, limit);
	},

	async get(id) {
		if (resolvedProvider === 'rest') {
			return restRequest(`/api/entities/${entityName}/${id}`);
		}

		return base44.entities[entityName].get(id);
	},

	subscribe(callback) {
		if (resolvedProvider === 'rest') {
			return () => {};
		}

		return base44.entities[entityName].subscribe(callback);
	},

	async create(payload) {
		if (resolvedProvider === 'rest') {
			return restRequest(`/api/entities/${entityName}`, {
				method: 'POST',
				body: payload
			});
		}

		return base44.entities[entityName].create(payload);
	},

	async bulkCreate(payload) {
		if (resolvedProvider === 'rest') {
			return restRequest(`/api/entities/${entityName}/bulk`, {
				method: 'POST',
				body: payload
			});
		}

		return base44.entities[entityName].bulkCreate(payload);
	},

	async update(id, payload) {
		if (resolvedProvider === 'rest') {
			return restRequest(`/api/entities/${entityName}/${id}`, {
				method: 'PATCH',
				body: payload
			});
		}

		return base44.entities[entityName].update(id, payload);
	},

	async delete(id) {
		if (resolvedProvider === 'rest') {
			return restRequest(`/api/entities/${entityName}/${id}`, {
				method: 'DELETE'
			});
		}

		return base44.entities[entityName].delete(id);
	}
});

/** @type {Record<string, EntityApi>} */
const entitiesApi = new Proxy(
	{},
	{
		get: (_target, entityName) => {
			if (typeof entityName !== 'string') {
				return undefined;
			}
			return createEntityApi(entityName);
		}
	}
);

export const backendProvider = resolvedProvider;

/**
 * @type {{
 *   auth: any;
 *   functions: any;
 *   integrations: any;
 *   entities: Record<string, EntityApi>;
 *   trainingAccounts: any;
 *   trainingLogs: any;
 *   transactions: any;
 *   raw: any;
 * }}
 */
export const backendClient = {
	auth: authApi,
	functions: functionsApi,
	integrations: integrationsApi,
	entities: entitiesApi,
	trainingAccounts: trainingAccountsApi,
	trainingLogs: trainingLogsApi,
	transactions: transactionsApi,
	raw: base44
};
