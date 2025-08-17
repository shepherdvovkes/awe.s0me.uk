const UserRepository = require('../repositories/UserRepository');
const MOTDRepository = require('../repositories/MOTDRepository');
const OpenAIRequestRepository = require('../repositories/OpenAIRequestRepository');

/**
 * Factory for creating repositories
 */
class RepositoryFactory {
    constructor(database) {
        this.database = database;
        this.repositories = new Map();
    }

    /**
     * Creates repository by type
     * @param {string} type - Repository type
     * @returns {Object} - Repository instance
     */
    create(type) {
        if (this.repositories.has(type)) {
            return this.repositories.get(type);
        }

        let repository;

        switch (type) {
            case 'user':
                repository = new UserRepository(this.database);
                break;
            case 'motd':
                repository = new MOTDRepository(this.database);
                break;
            case 'openai':
                repository = new OpenAIRequestRepository(this.database);
                break;
            default:
                throw new Error(`Unknown repository type: ${type}`);
        }

        this.repositories.set(type, repository);
        return repository;
    }

    /**
     * Gets user repository
     * @returns {UserRepository} - User repository instance
     */
    getUserRepository() {
        return this.create('user');
    }

    /**
     * Gets MOTD repository
     * @returns {MOTDRepository} - MOTD repository instance
     */
    getMOTDRepository() {
        return this.create('motd');
    }

    /**
     * Gets OpenAI request repository
     * @returns {OpenAIRequestRepository} - OpenAI request repository instance
     */
    getOpenAIRequestRepository() {
        return this.create('openai');
    }

    /**
     * Gets list of available repository types
     * @returns {Array<string>} - Available repository types
     */
    getAvailableTypes() {
        return ['user', 'motd', 'openai'];
    }
}

module.exports = RepositoryFactory; 