/// <reference types="jasmine" />

// This file ensures Jasmine types are used for .spec.ts files
// It overrides Cypress/Chai global types

declare global {
  function expect<T>(actual: T): jasmine.Matchers<T>;
  function expect<T>(actual: ArrayLike<T>): jasmine.ArrayLikeMatchers<T>;
  function expect(actual: any): jasmine.Matchers<any>;
}

export {};
