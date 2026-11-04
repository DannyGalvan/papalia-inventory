import type {
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { mapPickerResponse } from './mapPickerResponse';
import { ImageSource, PickedImage } from './types';

type Launcher<TOptions> = (options: TOptions) => Promise<ImagePickerResponse>;

/**
 * Adapter that turns a `react-native-image-picker` launcher (camera or
 * gallery) into an {@link ImageSource}. The launcher is injected so the same
 * class serves both origins and can be unit-tested without native modules.
 */
export class PickerImageSource<
  TOptions extends CameraOptions | ImageLibraryOptions,
> implements ImageSource
{
  constructor(
    private readonly launch: Launcher<TOptions>,
    private readonly options: TOptions,
  ) {}

  async pick(): Promise<PickedImage | null> {
    const response = await this.launch(this.options);
    return mapPickerResponse(response);
  }
}
