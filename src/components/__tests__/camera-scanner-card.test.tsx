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
    expect(textContents).toContain('QR Code Captured');
    expect(textContents).toContain('SCANNED-QR-12345');
    expect(textContents).toContain('Rescan QR Code');
  });
});
