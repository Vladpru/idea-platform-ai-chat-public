import {
  type ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function IsUuidV7(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isUuidV7',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && UUID_V7.test(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid UUID v7`;
        },
      },
    });
  };
}

const UUID_ANY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function IsUuid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isUuid',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && UUID_ANY.test(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid UUID`;
        },
      },
    });
  };
}
