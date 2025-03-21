# Api-gateway

This is a project that does XYZ. It utilizes NestJS, TypeORM, GRPC-connection to other microservices.

## Documentation

This project uses **TypeDoc** to generate API documentation for the codebase.

- The documentation is **automatically generated** via GitHub Actions whenever changes are pushed to the `main` branch.
- The generated documentation is deployed to **GitHub Pages**

## Workflow for Documentation

1. **Automatic Documentation Generation**:  
   Every time changes are pushed to the `main` branch, GitHub Actions will:
   - Generate API documentation using **TypeDoc**.
   - Deploy the documentation to **GitHub Pages**.

2. **Manually Trigger Documentation Generation**:  
   You can also manually trigger the documentation generation from the **Actions tab** in GitHub:
   - Go to the **Actions** tab of this repository.
   - Select the **"Generate TypeDoc Documentation"** workflow.
   - Click on **Run Workflow** to manually regenerate the documentation.
   - https://bazha.github.io/api-gateway/ - autogenerated documentation

## How to Contribute

- Clone the repository.
- Install dependencies with `npm install`.
- Generate documentation manually by running `npx typedoc` in your local environment (for local testing).
- Submit a pull request with any changes to the documentation or code.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
