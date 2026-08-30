import { User } from '@app/common';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OnboardingCompleteDto } from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @ApiOperation({ summary: 'Complete interactive onboarding wizard' })
  @ApiResponse({
    status: 201,
    description: 'Workspace and initial team created successfully',
  })
  @Post('complete')
  complete(
    @Body() dto: OnboardingCompleteDto,
    @User('id') memberId: string,
  ): Promise<any> {
    return this.onboardingService.complete(dto, memberId);
  }
}
