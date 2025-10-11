const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const FormData = require('form-data');

class ApiClient {
  constructor() {
    this.baseURL = process.env.ROLLOUT_API_URL || 'https://app.rollout.sh/api';
    this.baseDomain = process.env.ROLLOUT_DOMAIN || 'rollout.sh';
    this.token = this.getToken();
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add auth token to requests if available
    if (this.token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  getToken() {
    try {
      const configPath = path.join(os.homedir(), '.rollout', 'config.json');
      if (fs.existsSync(configPath)) {
        const config = fs.readJsonSync(configPath);
        return config.token;
      }
    } catch (error) {
      // Ignore errors, user needs to login
    }
    return null;
  }

  setToken(token) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    this.saveConfig({ token });
  }

  saveConfig(config) {
    try {
      const configDir = path.join(os.homedir(), '.rollout');
      const configPath = path.join(configDir, 'config.json');
      
      fs.ensureDirSync(configDir);
      fs.writeJsonSync(configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error('Failed to save configuration');
    }
  }

  async login(email, password) {
    try {
      const response = await this.client.post('/auth/login', {
        email,
        password,
      });
      
      const { token, user } = response.data;
      this.setToken(token);
      
      return { token, user };
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(name, email, password) {
    try {
      const response = await this.client.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation: password,
      });
      
      const { token, user } = response.data;
      this.setToken(token);
      
      return { token, user };
    } catch (error) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors.email) {
          throw new Error('Email already exists or is invalid');
        }
        if (errors.password) {
          throw new Error('Password requirements not met');
        }
        throw new Error('Validation failed: ' + Object.values(errors).flat().join(', '));
      }
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      // Ignore errors on logout
    } finally {
      this.token = null;
      delete this.client.defaults.headers.common['Authorization'];
      
      // Remove config file
      try {
        const configPath = path.join(os.homedir(), '.rollout', 'config.json');
        if (fs.existsSync(configPath)) {
          fs.removeSync(configPath);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  async getProjects() {
    try {
      const response = await this.client.get('/projects');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Please login first: rollout login');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch projects');
    }
  }

  async createProject(name, description = '') {
    try {
      const response = await this.client.post('/projects', {
        name,
        description,
      });
      return response.data.project;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Please login first: rollout login');
      }
      throw new Error(error.response?.data?.message || 'Failed to create project');
    }
  }

  async deployProject(projectId, files, options = {}) {
    try {
      const formData = new FormData();
      
      // Add files to form data
      for (const file of files) {
        formData.append('files[]', file.buffer, file.name);
      }
      
      // Add options
      if (options.commitHash) {
        formData.append('commit_hash', options.commitHash);
      }
      if (options.branch) {
        formData.append('branch', options.branch);
      }

      const response = await this.client.post(`/projects/${projectId}/deploy`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Please login first: rollout login');
      }
      throw new Error(error.response?.data?.message || 'Deployment failed');
    }
  }

  async getDeploymentStatus(projectId, deploymentId) {
    try {
      const response = await this.client.get(`/projects/${projectId}/deployments/${deploymentId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Please login first: rollout login');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch deployment status');
    }
  }

  async addDomain(projectId, domain) {
    try {
      const response = await this.client.post(`/projects/${projectId}/domains`, {
        domain,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Please login first: rollout login');
      }
      throw new Error(error.response?.data?.message || 'Failed to add domain');
    }
  }

  async removeDomain(projectId, domainId) {
    try {
      await this.client.delete(`/projects/${projectId}/domains/${domainId}`);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Please login first: rollout login');
      }
      throw new Error(error.response?.data?.message || 'Failed to remove domain');
    }
  }

  async getDomains(projectId) {
    try {
      const response = await this.client.get(`/projects/${projectId}/domains`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Please login first: rollout login');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch domains');
    }
  }

  getProjectUrl(slug) {
    // Use HTTP for local development domains to avoid SSL issues
    const protocol = this.baseDomain.includes('local.') || this.baseDomain.includes('.test') ? 'http' : 'https';
    return `${protocol}://${slug}.${this.baseDomain}`;
  }
}

module.exports = ApiClient;
