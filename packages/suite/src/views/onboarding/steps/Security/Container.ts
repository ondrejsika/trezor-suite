import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { State } from '@suite/types/onboarding/redux';
import { Dispatch } from '@suite/types';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';

import Step from './index';

const mapStateToProps = (state: State) => ({});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Step);
