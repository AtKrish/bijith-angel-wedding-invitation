export const weddingConfig = {
  couple: { personOne: 'Bijith', personTwo: 'Angel' },
  event: {
    weddingDate: '2027-01-25',
    // Ceremony countdown target: 10:30 AM on the wedding date in Asia/Kolkata.
    countdownDateTime: '2027-01-25T10:30:00+05:30',
    ceremonyTime: null, receptionDate: null, receptionTime: null,
    countdownPassedMessage: 'The day has arrived. We cannot wait to celebrate with you.',
    venueName: 'St Joseph Parish Hall', venueAddress: 'St Joseph Parish Hall, Kottamam',
    timezone: 'Asia/Kolkata', mapsUrl: 'https://maps.app.goo.gl/Js7CfH1nhZHCUMNg7', venueCoordinates: null
  },
  invitation: {
    envelopeLabel: 'For You',
    welcomeMessage: 'Together with our families, we would like to invite you to celebrate the most special day of our lives. It would be an honor to have you present with us as we begin this new journey.',
    scratchPrompt: 'Scratch to reveal the date', closingMessage: 'Come bless our beginning.'
  },
  audio: { src: './assets/bgm.mp3', autoplayAfterEnvelopeOpening: true, initialVolume: 0.35, loop: true },
  assets: {
    photos: ['./assets/photo1.jpg', './assets/photo2.jpg', './assets/photo3.jpg', './assets/photo4.jpg'],
    ringModel: './assets/ring_02.glb'
  },
  interactions: { scratchRevealThreshold: 0.55, flowerCelebrationOnce: true }
};



