import { describe, it, expect } from 'vitest';
import { locationCoordinateSchema, createSessionSchema } from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('Location Coordinate Schema', () => {
    it('accepts valid geographic coordinates within normal bounds', () => {
      const validLocation = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 12.5,
        capturedAt: Date.now(),
        altitude: 45,
        speed: 1.2,
        heading: 180,
      };

      const result = locationCoordinateSchema.safeParse(validLocation);
      expect(result.success).toBe(true);
    });

    it('rejects latitudes outside [-90, 90]', () => {
      const invalidLat = {
        latitude: 91.5,
        longitude: 0,
        accuracy: 10,
        capturedAt: Date.now(),
      };
      const result = locationCoordinateSchema.safeParse(invalidLat);
      expect(result.success).toBe(false);
    });

    it('rejects longitudes outside [-180, 180]', () => {
      const invalidLng = {
        latitude: 0,
        longitude: 185,
        accuracy: 10,
        capturedAt: Date.now(),
      };
      const result = locationCoordinateSchema.safeParse(invalidLng);
      expect(result.success).toBe(false);
    });

    it('rejects negative accuracy numbers', () => {
      const invalidAccuracy = {
        latitude: 45,
        longitude: 45,
        accuracy: -5,
        capturedAt: Date.now(),
      };
      const result = locationCoordinateSchema.safeParse(invalidAccuracy);
      expect(result.success).toBe(false);
    });
  });

  describe('Create Session Schema', () => {
    it('accepts valid session titles between 3 and 100 characters', () => {
      const valid = {
        title: 'Airport Terminal 2 Pickup',
        description: 'Meeting outside baggage claim',
      };
      const result = createSessionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects titles that are too short', () => {
      const tooShort = { title: 'Hi' };
      const result = createSessionSchema.safeParse(tooShort);
      expect(result.success).toBe(false);
    });
  });
});
