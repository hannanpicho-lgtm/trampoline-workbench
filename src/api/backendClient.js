import { base44 } from '@/api/base44Client';

const resolvedProvider = import.meta?.env?.VITE_BACKEND_PROVIDER || 'base44';
const apiBaseUrl = (import.meta?.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

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

const restRequest = async (path, { method = 'GET', body, query } = {}) => {
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

export const backendProvider = resolvedProvider;

export const backendClient = {
	trainingAccounts: trainingAccountsApi,
	trainingLogs: trainingLogsApi,
	transactions: transactionsApi,
	raw: base44
};
