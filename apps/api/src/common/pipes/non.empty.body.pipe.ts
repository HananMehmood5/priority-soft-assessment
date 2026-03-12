import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  ValidationPipe,
} from "@nestjs/common";

@Injectable()
export class RequireNonEmptyBodyPipe extends ValidationPipe {
  transform(value: any, _metadata: ArgumentMetadata) {
    const payloadKeys = Object.keys(value).join(", ");
    if (payloadKeys && !Object.values(value).filter(Boolean).length) {
      throw new BadRequestException({
        message: "Validation failed",
        errors: [
          `body: At least one of the following properties must be provided: ${payloadKeys}`,
        ],
      });
    }
    return value;
  }
}
