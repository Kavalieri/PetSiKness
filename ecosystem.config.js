module.exports = {
  apps: [
    {
      name: "petsikness-dev",
      script: "npm",
      args: "run dev",
      cwd: "/home/kava/workspace/proyectos/PetSiKness/repo",
      exec_mode: "fork", // ✅ Fork mode (como CuentasSiK)
      instances: 1,
      autorestart: true,
      watch: false, // ❌ NO PM2 watch - Next.js ya tiene hot reload
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
        PORT: 3002,
      },
      error_file: "/home/kava/.pm2/logs/petsikness-dev-error.log",
      out_file: "/home/kava/.pm2/logs/petsikness-dev-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
    {
      name: "petsikness-prod",
      script: "npm",
      args: "start",
      cwd: "/home/kava/workspace/proyectos/PetSiKness/repo",
      exec_mode: "fork", // ✅ Fork mode para consistencia
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
      },
      error_file: "/home/kava/.pm2/logs/petsikness-prod-error.log",
      out_file: "/home/kava/.pm2/logs/petsikness-prod-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
