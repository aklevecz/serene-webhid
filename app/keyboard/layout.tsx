import DefaultLayout from '@components/page/DefaultLayout';
import ModalStack from '@components/ModalStack';

export default function KeyboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DefaultLayout previewPixelSRC="https://intdev-global.s3.us-west-2.amazonaws.com/template-app-icon.png">
      {children}
      <ModalStack />
    </DefaultLayout>
  );
}
