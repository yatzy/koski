export const doActionWhileMounted = (stream, action) => stream.doAction(action).map(undefined).toProperty().startWith(undefined)