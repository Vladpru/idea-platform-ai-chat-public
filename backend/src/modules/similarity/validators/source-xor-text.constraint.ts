import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'sourceXorText', async: false })
export class SourceXorTextConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as { sourceId?: string; text?: string };
    const hasSource =
      typeof dto.sourceId === 'string' && dto.sourceId.length > 0;
    const hasText = typeof dto.text === 'string' && dto.text.trim().length > 0;
    return hasSource !== hasText;
  }

  defaultMessage(): string {
    return 'Exactly one of sourceId or text must be provided';
  }
}
