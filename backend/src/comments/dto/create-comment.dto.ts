import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(3000)
    content!: string;

    @IsOptional()
    @IsUUID()
    parentId?: string; 
}