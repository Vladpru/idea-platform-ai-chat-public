import { toast } from 'sonner';

export type MediaPermissionResult = {
  audio: boolean;
  video: boolean;
};

export async function requestMediaPermissions(): Promise<MediaPermissionResult> {
  if (!navigator.mediaDevices?.getUserMedia) {
    toast.error('Camera and microphone are not supported in this browser');
    return { audio: false, video: false };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    stream.getTracks().forEach(track => track.stop());
    return { audio: true, video: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      toast.message(
        'Joined without camera or microphone. Enable them from the call controls when ready.',
      );
      return { audio: false, video: false };
    }

    if (error instanceof DOMException && error.name === 'NotFoundError') {
      toast.message(
        'No camera or microphone found. Joining as a viewer with controls disabled.',
      );
      return { audio: false, video: false };
    }

    toast.error('Could not access camera or microphone. Joining without them.');
    return { audio: false, video: false };
  }
}
