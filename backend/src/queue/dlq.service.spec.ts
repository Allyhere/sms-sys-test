import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { DlqService } from './dlq.service';
import { SMS_DLQ } from './dlq.constants';
import { SMS_PROCESSING_QUEUE } from './queue.constants';

describe('DlqService', () => {
  let service: DlqService;
  let dlqQueue: Record<string, jest.Mock>;
  let mainQueue: Record<string, jest.Mock>;

  beforeEach(async () => {
    dlqQueue = {
      getJobs: jest.fn(),
      count: jest.fn(),
      getJob: jest.fn(),
      add: jest.fn(),
    };

    mainQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DlqService,
        { provide: getQueueToken(SMS_DLQ), useValue: dlqQueue },
        {
          provide: getQueueToken(SMS_PROCESSING_QUEUE),
          useValue: mainQueue,
        },
      ],
    }).compile();

    service = module.get<DlqService>(DlqService);
  });

  describe('getFailedJobs', () => {
    it('should return paginated failed jobs', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          data: { MessageSid: 'SM001' },
          attemptsMade: 3,
          failedReason: 'Connection refused',
          timestamp: 1755840000000,
        },
      ];
      dlqQueue.getJobs.mockResolvedValue(mockJobs);
      dlqQueue.count.mockResolvedValue(1);

      const result = await service.getFailedJobs(1, 20);

      expect(dlqQueue.getJobs).toHaveBeenCalledWith(['delayed', 'wait'], 0, 19);
      expect(result).toEqual({
        jobs: [
          {
            id: 'job-1',
            data: { MessageSid: 'SM001' },
            attemptsMade: 3,
            failedReason: 'Connection refused',
            timestamp: 1755840000000,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should handle pagination correctly for page 2', async () => {
      dlqQueue.getJobs.mockResolvedValue([]);
      dlqQueue.count.mockResolvedValue(25);

      const result = await service.getFailedJobs(2, 20);

      expect(dlqQueue.getJobs).toHaveBeenCalledWith(
        ['delayed', 'wait'],
        20,
        39,
      );
      expect(result.page).toBe(2);
      expect(result.total).toBe(25);
    });
  });

  describe('replayJob', () => {
    it('should re-enqueue job to main queue and remove from DLQ', async () => {
      const mockJob = {
        id: 'job-1',
        data: { MessageSid: 'SM001', From: '+15551234567', Body: 'Hello' },
        remove: jest.fn(),
      };
      dlqQueue.getJob.mockResolvedValue(mockJob);

      await service.replayJob('job-1');

      expect(mainQueue.add).toHaveBeenCalledWith(
        SMS_PROCESSING_QUEUE,
        mockJob.data,
        {
          jobId: 'job-1',
          attempts: 3,
          backoff: { type: 'exponential', delay: 1_000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      );
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job does not exist', async () => {
      dlqQueue.getJob.mockResolvedValue(null);

      await expect(service.replayJob('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeJob', () => {
    it('should remove the job from the DLQ', async () => {
      const mockJob = {
        id: 'job-1',
        remove: jest.fn(),
      };
      dlqQueue.getJob.mockResolvedValue(mockJob);

      await service.removeJob('job-1');

      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job does not exist', async () => {
      dlqQueue.getJob.mockResolvedValue(null);

      await expect(service.removeJob('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
