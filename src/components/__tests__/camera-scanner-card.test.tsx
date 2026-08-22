import React from 'react';
import { create, act } from 'react-test-renderer';
import { CameraScannerCard } from '../camera-scanner-card';
import { ThemedText } from '../themed-text';
import { useCameraPermissions } from 'expo-camera';

jest.mock('expo-camera', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const ReactMock = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return {
    CameraView: (props: any) =>
      ReactMock.createElement(View, { testID: 'mock-camera-view', ...props }),
    useCameraPermissions: jest.fn(),
  };
});

describe('CameraScannerCard', () => {
  const mockUseCameraPermissions = useCameraPermissions as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders permission prompt when permission is not granted', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: false }, jest.fn()]);

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard
          scanned={false}
          onScan={jest.fn()}
          onRescan={jest.fn()}
        />
      );
    });

    const textNodes = tree.root.findAllByType(ThemedText);
    const textContents = textNodes.map((node) => node.props.children);

    expect(textContents).toContain('Grant Camera Access');
    expect(
      textContents.some(
        (child) =>
          typeof child === 'string' &&
          child.includes('Camera access is required to scan physical QR codes.')
      )
    ).toBe(true);
  });

  it('renders CameraView and viewfinder overlay when permission is granted', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard
          scanned={false}
          onScan={jest.fn()}
          onRescan={jest.fn()}
        />
      );
    });

    const textNodes = tree.root.findAllByType(ThemedText);
    const textContents = textNodes.map((node) => node.props.children);

    expect(textContents).toContain('Ready');
    expect(textContents).toContain('Align QR Code in target box');
    expect(tree.root.findByProps({ testID: 'mock-camera-view' })).toBeTruthy();
  });

  it('renders scan locked state and rescan button when scanned is true', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard
          scanned={true}
          scannedValue="SCANNED-QR-12345"
          onScan={jest.fn()}
          onRescan={jest.fn()}
        />
      );
    });

    const textNodes = tree.root.findAllByType(ThemedText);
    const textContents = textNodes.map((node) => node.props.children);

    expect(textContents).toContain('Scan Locked');
    expect(textContents).toContain('Battery Serial No. Captured');
    expect(textContents).toContain('SCANNED-QR-12345');
    expect(textContents).toContain('Rescan QR Code');
  });

  it('truncates scanned QR code payload to 9 characters', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    const mockOnScan = jest.fn();

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard
          scanned={false}
          onScan={mockOnScan}
          onRescan={jest.fn()}
        />
      );
    });

    const cameraView = tree.root.findByProps({ testID: 'mock-camera-view' });

    act(() => {
      cameraView.props.onBarcodeScanned({ data: '1234567890EXTRA' });
    });

    expect(mockOnScan).toHaveBeenCalledWith('123456789');
  });

  it('renders expand button and opens full-screen scanner modal when pressed', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard
          scanned={false}
          onScan={jest.fn()}
          onRescan={jest.fn()}
        />
      );
    });

    const textNodes = tree.root.findAllByType(ThemedText);
    const textContents = textNodes.map((node) => node.props.children);
    expect(textContents).toContain('Expand');

    const expandBtn = tree.root.findByProps({ testID: 'expand-camera-button' });
    act(() => {
      expandBtn.props.onPress();
    });

    const modal = tree.root.findByProps({ testID: 'full-screen-camera-modal' });
    expect(modal.props.visible).toBe(true);
  });

  it('renders zoom preset pills and torch toggle inside full-screen camera modal', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard
          scanned={false}
          onScan={jest.fn()}
          onRescan={jest.fn()}
        />
      );
    });

    // Open full screen modal
    const expandBtn = tree.root.findByProps({ testID: 'expand-camera-button' });
    act(() => {
      expandBtn.props.onPress();
    });

    // Verify zoom preset buttons 1x, 2x, 3x, 5x exist
    const zoomPill2x = tree.root.findByProps({ testID: 'zoom-preset-2x' });
    expect(zoomPill2x).toBeTruthy();

    // Click 2x zoom preset
    act(() => {
      zoomPill2x.props.onPress();
    });

    // Verify full-screen CameraView receives updated zoom prop (0.15 for 2x)
    const cameraViews = tree.root.findAllByProps({ testID: 'mock-camera-view' });
    const fullScreenCamera = cameraViews.find((v) => v.props.zoom !== undefined);
    expect(fullScreenCamera?.props.zoom).toBe(0.15);

    // Toggle torch flashlight button
    const torchBtn = tree.root.findByProps({ testID: 'toggle-torch-button' });
    act(() => {
      torchBtn.props.onPress();
    });

    expect(fullScreenCamera?.props.enableTorch).toBe(true);
  });

  it('scans barcode in full-screen view, truncates to 9 chars, triggers onScan, and closes modal', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    const mockOnScan = jest.fn();

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <CameraScannerCard
          scanned={false}
          onScan={mockOnScan}
          onRescan={jest.fn()}
        />
      );
    });

    // Open full screen modal
    const expandBtn = tree.root.findByProps({ testID: 'expand-camera-button' });
    act(() => {
      expandBtn.props.onPress();
    });

    const cameraViews = tree.root.findAllByProps({ testID: 'mock-camera-view' });
    const fullScreenCamera = cameraViews.find((v) => v.props.zoom !== undefined);

    act(() => {
      fullScreenCamera?.props.onBarcodeScanned({ data: 'FULLSCREEN1234' });
    });

    expect(mockOnScan).toHaveBeenCalledWith('FULLSCREE');
    const modal = tree.root.findByProps({ testID: 'full-screen-camera-modal' });
    expect(modal.props.visible).toBe(false);
  });
});

