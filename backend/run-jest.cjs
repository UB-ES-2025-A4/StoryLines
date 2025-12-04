#!/usr/bin/env node

// Ejecuta Jest sin VM Modules
import('jest').then(({ default: jest }) => {
  jest.run();
});
