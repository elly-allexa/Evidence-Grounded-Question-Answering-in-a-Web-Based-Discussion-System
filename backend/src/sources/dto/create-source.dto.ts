import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['text', 'markdown'])
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  contentText!: string;
}
