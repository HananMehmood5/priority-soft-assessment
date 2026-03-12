import {
  BadRequestException,
  Injectable,
  ValidationError,
  ValidationPipe as NestValidationPipe
} from "@nestjs/common";

function flatten(errors: ValidationError[], parentPath = ""): string[] {
  const out: string[] = [];
  for (const e of errors) {
    const path = parentPath ? `${parentPath}.${e.property}` : e.property;
    if (e.constraints) out.push(...Object.values(e.constraints).map((m) => `${path}: ${m}`));
    if (e.children?.length) out.push(...flatten(e.children, path));
  }
  return out;
}

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = flatten(errors);
        return new BadRequestException({
          message: "Validation failed",
          errors: messages
        });
      }
    });
  }
}


