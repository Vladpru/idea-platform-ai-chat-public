import { type ValidationOptions, registerDecorator } from 'class-validator';

export function IsFutureIsoDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureIsoDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }

          const date = new Date(value);

          if (Number.isNaN(date.getTime())) {
            return false;
          }

          return date.getTime() > Date.now();
        },
      },
    });
  };
}
