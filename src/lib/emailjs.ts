import emailjs from '@emailjs/browser';

export const EMAILJS_PUBLIC_KEY = "c3dGcTMwnlYoZt1QQ";
export const EMAILJS_SERVICE_ID = "service_fmpndgn";
export const EMAILJS_TEMPLATE_ID = "template_z47v9aq";

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

export const sendDiscoveryCallEmail = async (email: string) => {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    user_email: email,
    subject: 'New Discovery Call Request — TechSpecialist',
    message: `Email: ${email}\nTimestamp: ${new Date().toUTCString()}`,
  });
};

export default emailjs;
