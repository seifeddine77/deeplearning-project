class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.logs = [];
    this.alertThresholds = {
      errorRate: 0.05,
      latency: 5000,
      cpuUsage: 80,
      memoryUsage: 85
    };
  }

  /**
   * Enregistrer une métrique
   */
  recordMetric(metricName, value, tags = {}) {
    try {
      const metric = {
        name: metricName,
        value,
        timestamp: new Date().toISOString(),
        tags
      };

      if (!this.metrics.has(metricName)) {
        this.metrics.set(metricName, []);
      }

      this.metrics.get(metricName).push(metric);

      // Garder seulement les 1000 dernières métriques
      if (this.metrics.get(metricName).length > 1000) {
        this.metrics.get(metricName).shift();
      }

      return {
        success: true,
        metric
      };
    } catch (error) {
      console.error('❌ Error recording metric:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les métriques
   */
  getMetrics(metricName, limit = 100) {
    try {
      if (!this.metrics.has(metricName)) {
        return {
          success: false,
          error: 'Metric not found'
        };
      }

      const allMetrics = this.metrics.get(metricName);
      const recentMetrics = allMetrics.slice(-limit);

      return {
        success: true,
        count: recentMetrics.length,
        metrics: recentMetrics
      };
    } catch (error) {
      console.error('❌ Error getting metrics:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Créer une alerte
   */
  createAlert(severity, message, details = {}) {
    try {
      const alert = {
        id: `alert_${Date.now()}`,
        severity, // 'critical', 'warning', 'info'
        message,
        details,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      this.alerts.push(alert);

      // Garder seulement les 500 dernières alertes
      if (this.alerts.length > 500) {
        this.alerts.shift();
      }

      console.log(`🚨 Alert [${severity}]: ${message}`);

      return {
        success: true,
        alert
      };
    } catch (error) {
      console.error('❌ Error creating alert:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les alertes actives
   */
  getActiveAlerts() {
    try {
      const activeAlerts = this.alerts.filter(a => !a.acknowledged);

      return {
        success: true,
        count: activeAlerts.length,
        alerts: activeAlerts
      };
    } catch (error) {
      console.error('❌ Error getting alerts:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reconnaître une alerte
   */
  acknowledgeAlert(alertId) {
    try {
      const alert = this.alerts.find(a => a.id === alertId);

      if (!alert) {
        return {
          success: false,
          error: 'Alert not found'
        };
      }

      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();

      return {
        success: true,
        alert
      };
    } catch (error) {
      console.error('❌ Error acknowledging alert:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enregistrer un log
   */
  logEvent(level, message, context = {}) {
    try {
      const logEntry = {
        id: `log_${Date.now()}`,
        level, // 'debug', 'info', 'warn', 'error'
        message,
        context,
        timestamp: new Date().toISOString()
      };

      this.logs.push(logEntry);

      // Garder seulement les 10000 derniers logs
      if (this.logs.length > 10000) {
        this.logs.shift();
      }

      console.log(`[${level.toUpperCase()}] ${message}`);

      return {
        success: true,
        logEntry
      };
    } catch (error) {
      console.error('❌ Error logging event:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les logs
   */
  getLogs(level = null, limit = 100) {
    try {
      let filteredLogs = this.logs;

      if (level) {
        filteredLogs = this.logs.filter(l => l.level === level);
      }

      const recentLogs = filteredLogs.slice(-limit);

      return {
        success: true,
        count: recentLogs.length,
        logs: recentLogs
      };
    } catch (error) {
      console.error('❌ Error getting logs:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir le statut du système
   */
  getSystemStatus() {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      const status = {
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
        },
        activeAlerts: this.alerts.filter(a => !a.acknowledged).length,
        totalMetrics: this.metrics.size,
        totalLogs: this.logs.length,
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        status
      };
    } catch (error) {
      console.error('❌ Error getting system status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un rapport de monitoring
   */
  generateMonitoringReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalMetrics: this.metrics.size,
          activeAlerts: this.alerts.filter(a => !a.acknowledged).length,
          totalAlerts: this.alerts.length,
          totalLogs: this.logs.length,
          errorLogs: this.logs.filter(l => l.level === 'error').length
        },
        systemStatus: this.getSystemStatus().status,
        recentAlerts: this.alerts.slice(-10),
        recentErrors: this.logs.filter(l => l.level === 'error').slice(-10)
      };

      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('❌ Error generating monitoring report:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new MonitoringService();
