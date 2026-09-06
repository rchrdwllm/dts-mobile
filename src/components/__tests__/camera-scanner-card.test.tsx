import React from 'react';
import { act, create } from 'react-test-renderer';

import { CameraScannerCard } from '../camera-scanner-card';
import { useCameraPermissions } from 'expo-camera';

jest.mock('expo-camera', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const ReactMock = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const CameraView = (props: any) =>
    ReactMock.createElement(View, { testID: 'mock-camera-view', ...props });
  CameraView.isModernBarcodeScannerAvailable = false;
  CameraView.launchScanner = jest.fn();
  CameraView.dismissScanner = jest.fn();
  CameraView.onModernBarcodeScanned = jest.fn(() => ({ remove: jest.fn() }));
  return { CameraView, useCameraPermissions: jest.fn() };
});

describe('CameraScannerCard', () => {
  const mockUseCameraPermissions = useCameraPermissions as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
  });

  it('does not mount a camera preview until the guided scan flow is opened', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard isOpen={false} onDismiss={jest.fn()} onScan={jest.fn()} />
      );
    });

    expect(() => tree.root.findByProps({ testID: 'mock-camera-view' })).toThrow();
  });

  it('shows a cancellable camera fallback when opened without the modern scanner', () => {
    const onDismiss = jest.fn();
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard isOpen onDismiss={onDismiss} onScan={jest.fn()} />
      );
    });

    expect(tree.root.findByProps({ testID: 'mock-camera-view' })).toBeTruthy();
    const cancelButton = tree.root.findByProps({ accessibilityLabel: 'Cancel battery scan' });

    act(() => {
      cancelButton.props.onPress();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('returns the sanitized battery value from the fallback scanner', () => {
    const onScan = jest.fn();
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard isOpen onDismiss={jest.fn()} onScan={onScan} />
      );
    });

    act(() => {
      tree.root
        .findByProps({ testID: 'mock-camera-view' })
        .props.onBarcodeScanned({ data: '1234567890EXTRA' });
    });

    expect(onScan).toHaveBeenCalledWith('123456789');
  });
});
