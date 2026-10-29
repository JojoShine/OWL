import {it,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SecurityConfigTab from './SecurityConfigTab';
import {systemConfigApi} from '@/lib/api';
vi.mock('@/lib/api',()=>({systemConfigApi:{updateConfig:vi.fn().mockResolvedValue({success:true})}}));
vi.mock('@/components/ui/toast',()=>({toast:{success:vi.fn(),requestError:vi.fn()}}));
it('submits persisted security choices without modifying unrelated configuration',async()=>{
 render(<SecurityConfigTab config={{password_policy:'standard',login_failure_limit:5,login_lock_minutes:15,system_name:'OWL'}}/>);
 await userEvent.click(screen.getByRole('button',{name:'保存安全设置'}));
 await waitFor(()=>expect(systemConfigApi.updateConfig).toHaveBeenCalledWith({password_policy:'standard',login_failure_limit:5,login_lock_minutes:15}));
});
it('does not offer a save action when configuration failed to load',()=>{
 render(<SecurityConfigTab config={null}/>);
 expect(screen.queryByRole('button',{name:'保存安全设置'})).toBeNull();
 expect(screen.getByText('安全配置暂时无法加载，请刷新后重试')).toBeInTheDocument();
});
