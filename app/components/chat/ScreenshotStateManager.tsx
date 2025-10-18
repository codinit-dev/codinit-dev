import { useEffect } from 'react';

interface ScreenshotStateManagerProps {
  setUploadedFiles?: (files: File[]) => void;
  setImageDataList?: (dataList: string[]) => void;
  uploadedFiles: File[];
  imageDataList: string[];
}

interface CodinitWindow extends Window {
  __codinit_SET_UPLOADED_FILES__?: (files: File[]) => void;
  __codinit_SET_IMAGE_DATA_LIST__?: (dataList: string[]) => void;
  __codinit_UPLOADED_FILES__?: File[];
  __codinit_IMAGE_DATA_LIST__?: string[];
}

declare const window: CodinitWindow;

export const ScreenshotStateManager = ({
  setUploadedFiles,
  setImageDataList,
  uploadedFiles,
  imageDataList,
}: ScreenshotStateManagerProps) => {
  useEffect(() => {
    if (setUploadedFiles && setImageDataList) {
      window.__codinit_SET_UPLOADED_FILES__ = setUploadedFiles;
      window.__codinit_SET_IMAGE_DATA_LIST__ = setImageDataList;
      window.__codinit_UPLOADED_FILES__ = uploadedFiles;
      window.__codinit_IMAGE_DATA_LIST__ = imageDataList;
    }

    return () => {
      delete window.__codinit_SET_UPLOADED_FILES__;
      delete window.__codinit_SET_IMAGE_DATA_LIST__;
      delete window.__codinit_UPLOADED_FILES__;
      delete window.__codinit_IMAGE_DATA_LIST__;
    };
  }, [setUploadedFiles, setImageDataList, uploadedFiles, imageDataList]);

  return null;
};
