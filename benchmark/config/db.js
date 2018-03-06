module.exports = {
	hostname: process.env.POSTGRES_HOST || '127.0.0.1',
	username: process.env.POSTGRES_USER || 'docker',
	password: process.env.POSTGRES_PASSWORD || 'docker',
	database: process.env.POSTGRES_DB || 'ship-hold-bench'
};