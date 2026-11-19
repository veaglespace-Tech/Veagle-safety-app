import ImageKit from 'imagekit';
import dotenv from 'dotenv';
dotenv.config();

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || 'public_AAS2evQ3M2ce2T2uoJ95Ml5Yb6g=';
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'private_5Ldo1lg2JaJoczmuFYp1rKCOSrk=';
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/m5ei0wbuw';

export const imagekit = new ImageKit({
  publicKey,
  privateKey,
  urlEndpoint,
});
