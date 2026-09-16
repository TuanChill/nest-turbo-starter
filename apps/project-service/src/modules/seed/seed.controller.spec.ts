import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SeedController } from './seed.controller';
import type { SeedService } from './seed.service';

jest.mock('@app/common', () => ({ Public: () => () => undefined }));
jest.mock('./seed.service', () => ({ SeedService: class SeedService {} }));

describe('SeedController', () => {
  it.each(['production', 'staging', undefined])(
    'hides the seed endpoint outside local development (%s)',
    (nodeEnv) => {
      const seedService = { seedAll: jest.fn() } as unknown as SeedService;
      const config = {
        get: jest.fn().mockReturnValue(nodeEnv),
      } as unknown as ConfigService;
      const controller = new SeedController(seedService, config);

      expect(() => controller.seed()).toThrow(NotFoundException);
      expect(seedService.seedAll).not.toHaveBeenCalled();
    },
  );

  it.each(['local', 'development'])(
    'keeps the seed endpoint available for %s maintenance',
    async (nodeEnv) => {
      const seedAll = jest.fn().mockResolvedValue({ success: true });
      const seedService = { seedAll } as unknown as SeedService;
      const config = {
        get: jest.fn().mockReturnValue(nodeEnv),
      } as unknown as ConfigService;
      const controller = new SeedController(seedService, config);

      await expect(controller.seed()).resolves.toEqual({ success: true });
      expect(seedAll).toHaveBeenCalledTimes(1);
    },
  );
});
