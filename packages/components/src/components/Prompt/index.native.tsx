import React from 'react';
import styled from 'styled-components/native';
import { Animated, Easing } from 'react-native';
import Icon from '../Icon';

import icons from '../../config/icons';
import { Omit, IconShape } from '../../support/types';
import colors from '../../config/colors';

const Pulse = styled.View<Omit<Props, 'model'>>`
    background-color: ${colors.GREEN_PRIMARY};
    opacity: 0.3;
    border-radius: 100;
    height: ${props => props.size};
    width: ${props => props.size};
    margin-left: -${props => ((props.size || 32) - (props.size || 32) * (props.ratio || 1)) / 2}px;
`;

const IconWrapper = styled.View<Omit<Props, 'model'>>`
    width: ${props => (props.size || 32) * (props.ratio || 1)};
    height: ${props => props.size};
`;

const Wrapper = styled.View`
    flex: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
`;

const ContentWrapper = styled.Text`
    color: ${colors.GREEN_PRIMARY};
    text-align: center;
    margin: 10px;
`;

const Animation = styled(Animated.View)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
`;

const modelToIcon = (model: model) => {
    const mapping: { [key: number]: IconShape } = {
        1: icons.T1,
        2: icons.T2,
    };
    return mapping[model];
};

type model = 1 | 2;

interface Props {
    model: model;
    size?: number;
    ratio?: number;
    children?: React.ReactNode;
}

class Prompt extends React.Component<Props> {
    state = {
        blinkAnim: new Animated.Value(0),
    };

    componentDidMount() {
        const { blinkAnim } = this.state;

        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.out(Easing.quad),
                }),
            ])
        ).start();
    }

    render() {
        const { size = 32, model, children } = this.props;
        const { blinkAnim } = this.state;

        const icon = modelToIcon(model);

        const scale = blinkAnim.interpolate({
            inputRange: [0, 0.25, 0.5, 1],
            outputRange: [0, 0.75, 1.5, 4],
        });

        const opacity = blinkAnim.interpolate({
            inputRange: [0, 0.25, 0.5, 1],
            outputRange: [0, 0.2, 0.3, 0],
        });

        return (
            <Wrapper>
                <IconWrapper size={size} ratio={icon.ratio}>
                    <Animation
                        style={{
                            opacity,
                            transform: [{ scaleX: scale }, { scaleY: scale }],
                        }}
                        size={size}
                        ratio={icon.ratio}
                    >
                        <Pulse size={size} ratio={icon.ratio} />
                    </Animation>
                    <Icon icon={icon} size={size} color={colors.GREEN_PRIMARY} />
                </IconWrapper>
                <ContentWrapper>{children}</ContentWrapper>
            </Wrapper>
        );
    }
}

export default Prompt;
