const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dental clinic management API',
      description: 'API hệ thống quản lý phòng khám nha khoa',
      version: '1.0.0',
    },
    servers: [
      {
        url: "http://localhost:8000", // url
        description: "Local server", // name
      },
      {
        url: "https://dental-clinic-manager-api-v2.onrender.com", // url
        description: "Production server", // name
      },
      {
        url: "https://dentalclinicmanagerapi-production.up.railway.app", // url
        description: "Production server 2", // name
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          name: "authorization",
          scheme: "bearer",
          in: "header",
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

function swaggerDocs(app, port) {
  // Swagger Page
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

  // Docs in JSON format
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })
  console.info(`Docs available at http://localhost:${port}/docs`)
}

module.exports = swaggerDocs;
