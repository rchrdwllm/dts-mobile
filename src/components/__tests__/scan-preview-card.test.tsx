import React from 'react';
import { create, act } from 'react-test-renderer';
import { ScanPreviewCard } from '../scan-preview-card';
import { ThemedText } from '../themed-text';

describe('ScanPreviewCard', () => {
  it('renders title and live XML payload with reference code', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<ScanPreviewCard inputNumber="REF123" timestamp="2026-08-20T12:00:00.000Z" />);
    });

    const textNodes = tree.root.findAllByType(ThemedText);
    const textContents = textNodes.map((node) => node.props.children);

    expect(textContents).toContain('XML Scan Preview');
    expect(textContents).toContain('Live XML Output');
    expect(
      textContents.some(
        (child) =>
          typeof child === 'string' &&
          child.includes('<InputNumber>REF123</InputNumber>') &&
          child.includes('<QRCodeData>SAMPLE-QR-987654321</QRCodeData>')
      )
    ).toBe(true);
  });

  it('renders custom QR payload when provided', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <ScanPreviewCard
          inputNumber="REF99"
          qrCodeData="CUSTOM-DATA"
          timestamp="2026-08-20T12:00:00.000Z"
        />
      );
    });

    const textNodes = tree.root.findAllByType(ThemedText);
    const textContents = textNodes.map((node) => node.props.children);

    expect(
      textContents.some(
        (child) =>
          typeof child === 'string' &&
          child.includes('<InputNumber>REF99</InputNumber>') &&
          child.includes('<QRCodeData>CUSTOM-DATA</QRCodeData>')
      )
    ).toBe(true);
  });

  it('renders fallback when inputNumber is empty', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<ScanPreviewCard inputNumber="" timestamp="2026-08-20T12:00:00.000Z" />);
    });

    const textNodes = tree.root.findAllByType(ThemedText);
    const textContents = textNodes.map((node) => node.props.children);

    expect(
      textContents.some(
        (child) =>
          typeof child === 'string' &&
          child.includes('<InputNumber>(None)</InputNumber>')
      )
    ).toBe(true);
  });
});
