it('does not keep the process alive for the captcha memory cleanup timer', () => {
  const timer = { unref: jest.fn() };
  const interval = jest.spyOn(global, 'setInterval').mockReturnValue(timer);
  try {
    jest.isolateModules(() => require('../../dist/shared/auth/captcha'));
    expect(interval).toHaveBeenCalledWith(expect.any(Function), 60000);
    expect(timer.unref).toHaveBeenCalledTimes(1);
  } finally {
    interval.mockRestore();
  }
});
