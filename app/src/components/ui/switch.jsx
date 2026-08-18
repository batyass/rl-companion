import { Switch as BaseSwitch } from "@base-ui/react/switch";

// A glass toggle switch built on Base UI's headless Switch (the shadcn/base-nova
// primitive this project already uses for Select). Styling lives in styles.css.
export function Switch({ className, ...props }) {
  return (
    <BaseSwitch.Root
      data-slot="switch"
      className={["rl-switch", className].filter(Boolean).join(" ")}
      {...props}
    >
      <BaseSwitch.Thumb data-slot="switch-thumb" className="rl-switch-thumb" />
    </BaseSwitch.Root>
  );
}

export default Switch;
