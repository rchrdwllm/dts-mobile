import React from 'react';
import { create, act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { ReferenceInputCard } from '../reference-input-card';

describe('ReferenceInputCard', () => {
  it('renders correctly with label and placeholder', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<ReferenceInputCard value="" onChangeText={jest.fn()} />);
    });

    const input = tree.root.findByType(TextInput);
    expect(input).toBeTruthy();
    expect(input.props.placeholder).toBe('Enter Reference Number...');
    expect(input.props.keyboardType).toBe('default');
  });

  it('sanitizes text when onChangeText is called', () => {
    const handleChangeText = jest.fn();
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<ReferenceInputCard value="" onChangeText={handleChangeText} />);
    });

    const input = tree.root.findByType(TextInput);

    act(() => {
      input.props.onChangeText('ABC-123!');
    });

    expect(handleChangeText).toHaveBeenCalledWith('ABC123');
  });

  it('supports custom placeholder and value props', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <ReferenceInputCard
          value="REF99"
          onChangeText={jest.fn()}
          placeholder="Custom Placeholder"
        />
      );
    });

    const input = tree.root.findByType(TextInput);
    expect(input.props.value).toBe('REF99');
    expect(input.props.placeholder).toBe('Custom Placeholder');
  });
});
