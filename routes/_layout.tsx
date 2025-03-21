import {
  BarChart,
  Dumbbell,
  LogIn,
  ShoppingBag,
  Trophy,
} from "../icons/index.ts";
import StreakIndicator from "../islands/StreakIndicator.tsx";
import ThemeController from "../islands/ThemeController.tsx";
import { AppProps } from "./_middleware.ts";

const stage = Deno.env.get("STAGE");

// todo: type state better
export default function Layout(props: AppProps) {
  const { state, Component } = props;
  return (
    <>
      <div className="navbar bg-base-100">
        {/* Logo */}
        <div className="navbar-start">
          <a href="/" className="btn btn-ghost text-xl">WeeWoo🚑</a>
          {stage}
        </div>

        {/* Right Side: Streak and Menus */}
        <div className="navbar-end flex items-center gap-4">
          {/* Streak - Always Visible */}
          {
            /* {state.session && (
            <StreakIndicator initialStreak={state.session.streakDays} />
          )} */
          }

          {/* Hamburger Menu for Mobile */}
          <div className="md:hidden">
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="menu dropdown-content bg-base-300 rounded-box z-10 mt-3 w-52 p-2 shadow"
              >
                <li>
                  <a href="/about">About</a>
                </li>
                <li>
                  <a href="/leaderboard">Leaderboard</a>
                </li>
                {state.session.user_id && (
                  <>
                    <li>
                      <a href="/profile">Profile</a>
                    </li>
                    <li>
                      <a href="/auth/logout">Logout</a>
                    </li>
                  </>
                )}
                {!state.session.user_id && (
                  <li>
                    <a href="/auth/login">Login</a>
                  </li>
                )}
                <li>
                  <ThemeController
                    initial_theme={props.state.session.preferences?.theme}
                  />
                </li>
              </ul>
            </div>
          </div>

          {/* Full Menu for Desktop */}
          <div className="hidden md:flex">
            <ul className="menu menu-horizontal px-1">
              <li>
                <a href="/about">About</a>
              </li>
              <li>
                <a href="/leaderboard">Leaderboard</a>
              </li>
              <li>
                <a href="/shop">Shop</a>
              </li>
              {state.session.user_id && (
                <>
                  <li>
                    <a href="/profile">Profile</a>
                  </li>
                  <li>
                    <a href="/auth/logout">Logout</a>
                  </li>
                </>
              )}
              {!state.session.user_id && (
                <li>
                  <a href="/auth/login">Login</a>
                </li>
              )}
              <li>
                <ThemeController
                  initial_theme={props.state.session.preferences?.theme}
                />
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main content area that grows */}
      <main className="pb-16 md:pb-0">
        <Component />
      </main>

      {/* Dock - Hidden on md and larger screens */}
      <div className="dock md:hidden">
        <a
          href="/leaderboard"
          className={`flex flex-col items-center ${
            props.route === "/leaderboard" ? "dock-active" : ""
          }`}
        >
          <Trophy className="size-[1.2em]" />
          <span className="dock-label">Leaderboard</span>
        </a>

        <a
          href="/emt/practice"
          className={`flex flex-col items-center ${
            props.route === "/emt/practice" ? "dock-active" : ""
          }`}
        >
          <Dumbbell className="size-[1.2em]" />
          <span className="dock-label">Practice</span>
        </a>

        <a
          href={state.session.user_id ? "/profile" : "/auth/login"}
          className={`flex flex-col items-center ${
            props.route === "/profile" ? "dock-active" : ""
          }`}
        >
          {state.session.user_id
            ? <BarChart className="size-[1.2em]" />
            : <LogIn className="size-[1.2em]" />}
          <span className="dock-label">
            {state.session.user_id ? "Stats" : "Login"}
          </span>
        </a>

        <a
          href="/shop"
          className={`flex flex-col items-center ${
            props.route.includes("/shop") ? "dock-active" : ""
          }`}
        >
          <ShoppingBag className="size-[1.2em]" />
          <span className="dock-label">Shop</span>
        </a>
      </div>
    </>
  );
}
