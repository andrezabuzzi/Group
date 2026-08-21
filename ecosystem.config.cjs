module.exports = {
  apps: [
    {
      name: "confeccao-pro",
      script: "./dist/server.cjs",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
}
