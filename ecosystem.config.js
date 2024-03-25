module.exports = {
  apps: [
    {
      name: "Cloud_agent",
      interpreter: "node",
      script: "./index.js",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        DB_HOST: "",
        DB_USER: "",
        DATABASE: "",
        PASSWORD: "",
      },
      watch: true,
      ignore_watch: ["build/.well-known", "logs", "node_modules"],
      merge_logs: true,
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss.SSS Z",
    },
  ],
  deploy: {
    production: {
      user: "ubuntu",
      host: "cloudpc2.grinbit.io",
      key: "~/.ssh/grinbit-deploy.key",
      ssh_options: "StrictHostKeyChecking=no",
      repo: "git@github.com:grinbit-korea/cloud_agent.git",
      ref: "origin/master",
      "post-setup": "yarn ; pm2 start ;",
      "post-deploy": "yarn ; pm2 reload ecosystem.config.js --env production;",
      path: "/home/ubuntu/cloud_agent",
    },
  },
};
