export const NextIcon = ({ ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 39 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M36.25 0H38.25V15H36.25V8.11859V6.88141V0Z" fill="currentColor" />
    <path
      d="M23.25 7.5L17.25 9.17618L0 13.9952L1.32493e-06 1.00481L17.25 5.82382L23.25 7.5Z"
      fill="currentColor"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M36.25 8.11859L38.25 7.5L36.25 6.88141V8.11859ZM17.25 9.17618L23.25 7.5L17.25 5.82382L17.25 9.17618Z"
      fill="currentColor"
    />
    <path
      d="M17.25 1.00481L36.25 6.88141V8.11859L17.25 13.9952V9.17618L23.25 7.5L17.25 5.82382V1.00481Z"
      fill="currentColor"
    />
  </svg>
);
export const PreviousIcon = ({ ...props }: React.SVGProps<SVGSVGElement>) => (
  <NextIcon {...props} className={`rotate-180 ${props.className}`} />
);
